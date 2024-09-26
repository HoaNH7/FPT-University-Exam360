using System;
using System.IO;
using System.Threading.Tasks;

public class FileService
{
    public readonly string basePath;

    public FileService(string inputBasePath)
    {
        basePath = inputBasePath;
    }

    public async Task<string> WriteToFileAsync(string fileName, Stream fileStream)
    {
        var filePath = Path.Combine(basePath, fileName);
        using (var fileStreamOutput = new FileStream(filePath, FileMode.Create, FileAccess.Write))
        {
            await fileStream.CopyToAsync(fileStreamOutput);
        }

        return filePath;
    }

    public async Task<string> ReadFromFileAsync(string filePath)
    {
        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"The file {filePath} does not exist.");
        }

        using (StreamReader reader = new StreamReader(filePath))
        {
            return await reader.ReadToEndAsync();
        }
    }
}
